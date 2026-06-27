import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import SummaryCard from '../components/SummaryCard';
import { VaultSafe, StopwatchHourglass, ToolkitShield, InvoiceClipboard, BackArrowIcon } from '../components/PremiumIcons';

export default function AssetOperations({ records, setRecords, setView, currency, currencyConfig, formatVal, fromBase, toBase }) {
  // Filters state
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Details Modal
  const [selectedRental, setSelectedRental] = useState(null);
  const [rentalNotifications, setRentalNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Manual Trigger form
  const [triggerType, setTriggerType] = useState('Email');
  const [selectedTemplate, setSelectedTemplate] = useState('Return Reminder');
  const [customMessageText, setCustomMessageText] = useState('');
  const [customSubjectText, setCustomSubjectText] = useState('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  
  // Fetch Notification history for a specific rental
  const fetchRentalNotifications = async (rentalId) => {
    setLoadingNotifications(true);
    try {
      const res = await fetch(`http://localhost:5000/api/notifications?rentalId=${rentalId}`);
      if (res.ok) {
        const data = await res.json();
        setRentalNotifications(data.data || []);
      }
    } catch (e) {
      console.warn("Failed to fetch rental notification history:", e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle click on row to view rental detail history
  const handleViewDetails = (rental) => {
    setSelectedRental(rental);
    fetchRentalNotifications(rental.rentalId);
    // Reset custom message form
    setTriggerType('Email');
    setSelectedTemplate('Return Reminder');
    setCustomMessageText('');
    setCustomSubjectText('');
  };

  // Close details overlay
  const handleCloseDetails = () => {
    setSelectedRental(null);
    setRentalNotifications([]);
  };

  // Pre-populate manual notification message body & subject line when template changes
  useEffect(() => {
    if (!selectedRental) return;
    
    const customerName = selectedRental.customerName || 'Customer';
    const deviceModel = selectedRental.deviceModel || 'device';
    const rentalId = selectedRental.rentalId || '';
    const deposit = selectedRental.securityDepositHeld || 0;
    const rawEndDate = selectedRental.endDate || '';
    const endDate = rawEndDate ? new Date(rawEndDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    const deduction = parseFloat(selectedRental.damageDeduction) || 0;
    const netRefund = deposit - deduction;
    
    let subjectText = '';
    let msgText = '';
    
    if (selectedTemplate === 'Return Reminder') {
      subjectText = `⏰ Return Checklist Reminder [Ref: ${rentalId}]`;
      msgText = `Dear ${customerName},\n\nThis is a friendly reminder that your electronic rental ${deviceModel} (Ref: ${rentalId}) is due for check-in on ${endDate}.\n\nPlease return all items in clean condition to avoid deductions. Held deposit: ₹${deposit}.`;
    } else if (selectedTemplate === 'Overdue Alert') {
      const days = Math.round((new Date() - new Date(endDate)) / (1000*60*60*24)) || 0;
      subjectText = `⚠️ URGENT: Overdue Equipment Return Alert [Ref: ${rentalId}]`;
      msgText = `Dear ${customerName},\n\n🚨 URGENT: Your rental of ${deviceModel} (Ref: ${rentalId}) is overdue by ${days > 0 ? days : 1} days. Late penalty fees of ₹1,250/day are accumulating against your deposit of ₹${deposit}. Please return the device immediately.`;
    } else if (selectedTemplate === 'Payment Reminder') {
      subjectText = `💳 Settlement Invoice Payment Reminder [Ref: ${rentalId}]`;
      msgText = `Dear ${customerName},\n\nWe have completed the check-in assessment for your rental ${deviceModel} (Ref: ${rentalId}).\n\nItemized math ledger:\n- Deposit held: ₹${deposit}\n- Deductions: ₹${deduction}\n- Net payout: ₹${netRefund}\n\nPlease contact the payments desk to clear your account.`;
    } else {
      subjectText = `🛡️ Update from One Point Solutions Support [Ref: ${rentalId}]`;
      msgText = `Dear ${customerName},\n\n`;
    }
    
    setCustomSubjectText(subjectText);
    setCustomMessageText(msgText);
  }, [selectedTemplate, selectedRental]);

  // Handle manual notification dispatch trigger
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!selectedRental) return;
    
    setIsSendingAlert(true);
    try {
      const res = await fetch('http://localhost:5000/api/notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: selectedRental.rentalId,
          type: triggerType,
          templateName: 'Custom Message', // always custom message to send custom subject/body
          customMessage: customMessageText,
          customSubject: customSubjectText
        })
      });
      
      const resData = await res.json();
      if (res.ok && resData.success) {
        alert(resData.message || 'Notification dispatched successfully.');
        // Refresh logs
        fetchRentalNotifications(selectedRental.rentalId);
      } else {
        throw new Error(resData.error || 'Trigger failed');
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to send notification: ${err.message}`);
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Helper: check if a record is overdue (Active and endDate is in the past)
  const isRecordOverdue = (record) => {
    if (!record || record.settlementStatus === 'Settled') return false;
    const end = new Date(record.endDate);
    const today = new Date();
    // Normalize to dates
    end.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return today > end;
  };

  // Helper: check if a record has urgent moisture exposure
  const hasMoistureTriage = (record) => {
    if (!record) return false;
    const desc = (record.damageType || '').toLowerCase();
    const notes = (record.notes || '').toLowerCase();
    return desc.includes('water') || desc.includes('fluid') || notes.includes('isolated') || record.settlementStatus === 'Isolated Repair';
  };

  // Derived calculations for metrics
  const activeRentals = records.filter(r => r.settlementStatus !== 'Settled');
  const overdueCount = activeRentals.filter(isRecordOverdue).length;
  const isolatedCount = records.filter(r => r.settlementStatus === 'Isolated Repair').length;
  const underReviewCount = records.filter(r => r.settlementStatus === 'Under Review').length;
  const totalHeldDeposit = activeRentals.reduce((sum, r) => sum + (parseFloat(r.securityDepositHeld) || 0), 0);
  const priorityOverdues = records.filter(isRecordOverdue);
  const priorityTriages = records.filter(hasMoistureTriage).filter(r => r.settlementStatus !== 'Settled');

  // Filters logic
  const filteredRecords = records.filter(r => {
    // 1. Status Filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Overdue') {
        if (!isRecordOverdue(r)) return false;
      } else if (r.settlementStatus !== statusFilter) {
        return false;
      }
    }
    // 3. Search Query (Rental ID, Customer Name, Category)
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchId = (r.rentalId || '').toLowerCase().includes(q);
      const matchName = (r.customerName || '').toLowerCase().includes(q);
      const matchDevice = (r.deviceModel || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchDevice) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No asset records available to export.");
      return;
    }
    
    // CSV headers
    const headers = ["Rental ID", "Customer Name", "Device Model", "Held Deposit (Base INR)", "Rental Status", "Start Date", "End Date"];
    
    // Map records to rows
    const rows = filteredRecords.map(r => {
      let activeStatus = r.settlementStatus;
      const isOverdue = r.endDate && new Date(r.endDate) < new Date() && r.settlementStatus === 'Held';
      if (isOverdue) activeStatus = 'Overdue';
      return [
        r.rentalId,
        r.customerName,
        r.deviceModel,
        r.securityDepositHeld,
        activeStatus,
        r.startDate ? new Date(r.startDate).toLocaleDateString() : 'N/A',
        r.endDate ? new Date(r.endDate).toLocaleDateString() : 'N/A'
      ];
    });
    
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
    link.setAttribute("download", `OnePointSolutions_AssetFleet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem' }}>
      
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>💼</span> Asset Operations Dashboard
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time deployment audit, deposit escrows, and messaging communications log.
          </p>
        </div>
      </div>

      {/* Back Button displayed when statusFilter is active (not 'All') */}
      {statusFilter !== 'All' && (
        <div style={{ flexShrink: 0, animation: 'fadeIn 0.2s ease-in-out' }}>
          <button
            onClick={() => setStatusFilter('All')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', // Beautiful Indigo to Cyan gradient
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.45)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.35)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
            }}
          >
            <BackArrowIcon size={14} />
            Back to All Assets
          </button>
        </div>
      )}

      {/* Top compact notification banner */}
      {(() => {
        const alertCount = priorityOverdues.length + priorityTriages.length;
        if (alertCount === 0) return null;
        
        return (
          <div style={{
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.08) 100%)',
            border: '1.2px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
            backdropFilter: 'blur(8px)',
            margin: '0 0 4px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem' }}>🔔</span>
              <span>
                <strong>System Alerts Active:</strong> {priorityOverdues.length} Overdue Returns and {priorityTriages.length} Isolated Repair Triages require manual dispatch or settlement review.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {priorityOverdues.length > 0 && (
                <button
                  onClick={() => setStatusFilter('Overdue')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.18)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '5px',
                    color: 'var(--warning)',
                    padding: '3px 9px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  Filter Overdue
                </button>
              )}
              {priorityTriages.length > 0 && (
                <button
                  onClick={() => setStatusFilter('Isolated Repair')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '5px',
                             padding: '3px 9px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  Filter Isolated
                </button>
              )}
            </div>
          </div>
        );
      })()}
 
      {/* Metrics Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', flexShrink: 0, alignItems: 'start' }}>
        <SummaryCard
          title="Active Held Deposits"
          value={formatVal(totalHeldDeposit)}
          icon={<VaultSafe />}
          hideActionText={true}
          type="primary"
          onClick={() => setStatusFilter(statusFilter === 'Held' ? 'All' : 'Held')}
          isSelected={statusFilter === 'Held'}
        />
 
        <SummaryCard
          title="Overdue Returns"
          value={overdueCount}
          icon={<StopwatchHourglass />}
          hideActionText={true}
          type="warning"
          onClick={() => setStatusFilter(statusFilter === 'Overdue' ? 'All' : 'Overdue')}
          isSelected={statusFilter === 'Overdue'}
        />
 
        <SummaryCard
          title="Isolated Repair Triage"
          value={isolatedCount}
          icon={<ToolkitShield />}
          hideActionText={true}
          type="danger"
          onClick={() => setStatusFilter(statusFilter === 'Isolated Repair' ? 'All' : 'Isolated Repair')}
          isSelected={statusFilter === 'Isolated Repair'}
        />
 
        <SummaryCard
          title="Awaiting Settlement"
          value={underReviewCount}
          icon={<InvoiceClipboard />}
          hideActionText={true}
          type="primary"
          onClick={() => setStatusFilter(statusFilter === 'Under Review' ? 'All' : 'Under Review')}
          isSelected={statusFilter === 'Under Review'}
        />
      </div>
 
      {/* Main Operations Split Panel */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        
        {/* Operations Table & Filters */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
          
          {/* Table Toolbar & Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexShrink: 0 }}>
            
            {/* Status Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { id: 'All', label: 'All Statuses' },
                { id: 'Held', label: 'Held/Active' },
                { id: 'Under Review', label: 'Under Review' },
                { id: 'Isolated Repair', label: 'Isolated' },
                { id: 'Settled', label: 'Settled' },
                { id: 'Overdue', label: 'Overdue' }
              ].map(item => {
                const active = statusFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      borderRadius: '20px',
                      border: '1px solid var(--border-color)',
                      background: active ? 'var(--primary)' : 'var(--bg-input)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: active ? 600 : 'normal',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Right Side: Text Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  height: '32px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                📊 Export CSV
              </button>
              <input
                type="text"
                className="form-control"
                placeholder="Search name/ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '0 8px', fontSize: '0.78rem', height: '32px', width: '130px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
              />
            </div>

          </div>

          {/* Records Table */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {records.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📁</div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>No Deployed Assets</h3>
                <p style={{ margin: '6px 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: '1.4' }}>
                  There are currently no active rental asset agreements recorded in the database.
                </p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '45px 20px', textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>No Matching Deployments</h3>
                <p style={{ margin: '4px 0 14px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: '1.4' }}>
                  Your search filters did not return any matching records from the active assets database.
                </p>
                <button
                  type="button"
                  className="action-btn-small"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                  }}
                  style={{ fontSize: '0.78rem', fontWeight: 'bold', padding: '6px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '6px', transition: 'all var(--transition-fast)' }}
                >
                  Reset Active Filters
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="custom-table">
                <thead>
                  <tr style={{ borderBottom: '2.5px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    <th style={{ padding: '12px 10px' }}>Rental ID</th>
                    <th>Customer</th>
                    <th>Device Model</th>
                    <th>Rental Dates</th>
                    <th>Held Deposit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.82rem' }}>
                  {filteredRecords.map((r, index) => {
                    const overdue = isRecordOverdue(r);
                    return (
                      <tr
                        key={r.rentalId || index}
                        className="clickable-row"
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: overdue ? 'rgba(245, 158, 11, 0.02)' : undefined
                        }}
                        onClick={() => handleViewDetails(r)}
                        title="Click to view history timeline and dispatch reminders"
                      >
                        <td style={{ padding: '12px 10px' }}>
                          <span className="rental-tracking-id" style={{ fontWeight: 700 }}>{r.rentalId}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.customerName}</div>
                          <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{r.customerPhone}</small>
                        </td>
                        <td>{r.deviceModel}</td>
                        <td>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                            {r.startDate ? new Date(r.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: overdue ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: overdue ? '700' : 'normal', marginTop: '2px' }}>
                            to {r.endDate ? new Date(r.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'} {overdue && '(Overdue)'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {formatVal(r.securityDepositHeld)}
                          {parseFloat(r.damageDeduction) > 0 && (
                            <div style={{ color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 'normal' }}>
                              Deduct: −{formatVal(r.damageDeduction)}
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={r.settlementStatus} />
                          {r.settlementStatus === 'Settled' && r.settlementAt && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                              On: {new Date(r.settlementAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>



      </div>

      {/* Slide-over Detailed Modal: Rental Complete History */}
      {selectedRental && (
        <div
          className="ops-modal-overlay"
          style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'stretch' }}
          onClick={handleCloseDetails}
        >
          <div
            className="ops-modal-container"
            style={{
              width: '100%',
              maxWidth: '650px',
              height: '100%',
              maxHeight: '100vh',
              borderRadius: '0',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalSlideInRight 0.3s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            
            {/* Modal Sticky Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📜</span> Rental Transaction Log: {selectedRental.rentalId}
                </h3>
                <small style={{ color: 'var(--text-secondary)' }}>Complete operational history & audit trail</small>
              </div>
              <button
                onClick={handleCloseDetails}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.4rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Profile Overview Card */}
              <div className="glass-panel" style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 'bold' }}>Customer Profile</small>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', margin: '2px 0' }}>{selectedRental.customerName}</strong>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Email: {selectedRental.customerEmail}</span>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Phone: {selectedRental.customerPhone}</span>
                </div>
                <div>
                  <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 'bold' }}>KYC Compliance & Device</small>
                  <div style={{ margin: '2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#fff',
                      background: selectedRental.kycStatus === 'Verified' ? 'var(--success)' : selectedRental.kycStatus === 'Pending' ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      KYC: {selectedRental.kycStatus || 'Verified'}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Device: <strong>{selectedRental.deviceModel}</strong></span>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Serial: {selectedRental.deviceSerial || 'N/A'}</span>
                </div>
              </div>

              {/* Chronological Lifecycle Timeline */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                  ⏳ Rental Lifecycle Timeline
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)', margin: '4px 0 4px 6px', gap: '14px' }}>
                  
                  {/* Step 1: Booking Created */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-card)' }} />
                    <div style={{ fontSize: '0.82rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>🚀 Booking Intake Registered</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: '6px' }}>{selectedRental.startDate ? new Date(selectedRental.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Initial Notes: "{selectedRental.notes || 'Perfect operational condition checked.'}"
                      </p>
                      <small style={{ color: 'var(--text-secondary)' }}>Security escrow deposit held: <strong>{formatVal(selectedRental.securityDepositHeld)}</strong></small>
                    </div>
                  </div>

                  {/* Step 2: Return Handin */}
                  {selectedRental.settlementStatus !== 'Held' && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: selectedRental.settlementStatus === 'Isolated Repair' ? 'var(--danger)' : 'var(--warning)', border: '2px solid var(--bg-card)' }} />
                      <div style={{ fontSize: '0.82rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>📋 Returned Check-in Audit Completed</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: '6px' }}>{selectedRental.endDate ? new Date(selectedRental.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                        <div style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <div>Assessed damages: <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{selectedRental.damageType || 'None'}</span></div>
                          {parseInt(selectedRental.daysOverdue) > 0 && (
                            <div style={{ color: '#b45309', fontWeight: '600' }}>Returned Overdue: {selectedRental.daysOverdue} Days (Late Fee Applied)</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Final Settlement Closure */}
                  {selectedRental.settlementStatus === 'Settled' && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-card)' }} />
                      <div style={{ fontSize: '0.82rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>🏁 Settlement Reconciled & Closed</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: '6px' }}>
                          {selectedRental.settlementAt ? new Date(selectedRental.settlementAt).toLocaleDateString() : 'Reconciled'}
                        </span>
                        <div style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <div>Reconciliation Mode: <strong>{selectedRental.paymentMethod || 'Refund Ledger Transfer'}</strong></div>
                          <div>Deductions Applied: <strong style={{ color: 'var(--danger)' }}>{formatVal(selectedRental.damageDeduction)}</strong></div>
                          <div>Net Payout Released: <strong style={{ color: 'var(--success)' }}>{formatVal(selectedRental.securityDepositHeld - selectedRental.damageDeduction)}</strong></div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Notification History for this Specific Rental */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                  📬 Dispatched Message History
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {loadingNotifications ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                      <span className="spinner-loader" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : rentalNotifications.length === 0 ? (
                    <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.76rem', textAlign: 'center' }}>
                      No communications have been dispatched for this rental record.
                    </div>
                  ) : (
                    rentalNotifications.map(n => (
                      <div
                        key={n.id}
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.76rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            color: '#fff',
                            background: n.type === 'Email' ? 'var(--primary)' : 'var(--success)'
                          }}>
                            {n.type === 'Email' ? '✉️ Email' : '💬 WhatsApp'}
                          </span>
                          <small style={{ color: 'var(--text-muted)' }}>
                            {new Date(n.createdAt).toLocaleString()}
                          </small>
                        </div>
                        {n.subject && (
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            Subject: {n.subject}
                          </div>
                        )}
                        <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.74rem', lineHeight: '1.3' }}>
                          {n.message}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                          {n.type === 'WhatsApp' ? (
                            <button
                              onClick={() => {
                                const cleanNum = n.recipient.replace(/[^\d+]/g, '');
                                window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(n.message)}`, '_blank');
                              }}
                              style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '4px',
                                color: 'var(--success)',
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={`Send actual message to: ${n.recipient}`}
                            >
                              📲 Send on WhatsApp
                            </button>
                          ) : n.type === 'Email' ? (
                            <button
                              onClick={() => {
                                window.open(`mailto:${n.recipient}?subject=${encodeURIComponent(n.subject || 'One Point Solutions Notification')}&body=${encodeURIComponent(n.message)}`, '_blank');
                              }}
                              style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '4px',
                                color: 'var(--primary)',
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={`Compose mail to: ${n.recipient}`}
                            >
                              ✉️ Compose Email
                            </button>
                          ) : null}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.64rem', color: 'var(--success)', fontWeight: 'bold', marginTop: '4px' }}>
                          ✓ Dispatched via API
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Messaging Layer manual trigger console */}
              <div style={{ background: 'rgba(37, 99, 235, 0.03)', border: '1.5px dashed var(--border-color-hover)', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span> Dispatch Operational Message
                </h4>
                
                <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Communication Channel</label>
                      <select
                        value={triggerType}
                        onChange={e => setTriggerType(e.target.value)}
                        className="form-control"
                        style={{ fontSize: '0.8rem', height: '34px', padding: '4px 8px', background: 'var(--bg-card)', cursor: 'pointer' }}
                      >
                        <option value="Email">Email API</option>
                        <option value="WhatsApp">WhatsApp Business API</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Message Template</label>
                      <select
                        value={selectedTemplate}
                        onChange={e => setSelectedTemplate(e.target.value)}
                        className="form-control"
                        style={{ fontSize: '0.8rem', height: '34px', padding: '4px 8px', background: 'var(--bg-card)', cursor: 'pointer' }}
                      >
                        <option value="Return Reminder">Return Reminder</option>
                        <option value="Overdue Alert">Overdue Alert</option>
                        <option value="Payment Reminder">Payment Reminder</option>
                        <option value="Custom Message">Custom Message</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '6px' }}>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Subject Line (Editable)</label>
                    <input
                      type="text"
                      value={customSubjectText}
                      onChange={e => setCustomSubjectText(e.target.value)}
                      className="form-control"
                      placeholder="Message subject..."
                      style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Message Body (Editable Preview)</label>
                    <textarea
                      value={customMessageText}
                      onChange={e => setCustomMessageText(e.target.value)}
                      className="form-control"
                      placeholder="Type custom text alert..."
                      rows="4"
                      style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'var(--bg-card)', resize: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingAlert}
                    className="action-btn"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)',
                      border: 'none',
                      color: '#fff',
                      cursor: isSendingAlert ? 'not-allowed' : 'pointer',
                      opacity: isSendingAlert ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '4px'
                    }}
                  >
                    {isSendingAlert ? (
                      <>
                        <span className="spinner-loader" style={{ width: '12px', height: '12px', border: '1.5px solid rgba(255,255,255,0.3)', borderTop: '1.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Dispatching Alert...
                      </>
                    ) : (
                      `⚡ Send Simulated ${triggerType === 'Email' ? 'Email Confirmation' : 'WhatsApp alert'}`
                    )}
                  </button>
                </form>
              </div>

            </div>

            {/* Modal Sticky Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', position: 'sticky', bottom: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="action-btn-small"
                onClick={handleCloseDetails}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Close Logs
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
