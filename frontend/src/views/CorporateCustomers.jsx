import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { CorporateCustomersIcon } from '../components/PremiumIcons';

export default function CorporateCustomers({ records, setView }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only corporate customers
  const corporateRecords = records.filter(r => r.isCorporate === true);

  // Apply search query
  const filteredRecords = corporateRecords.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.rentalId?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.customerEmail?.toLowerCase().includes(q) ||
      r.deviceModel?.toLowerCase().includes(q)
    );
  });

  const handleActionClick = (id) => {
    // Append the ID to the URL without full reload, then switch to detail view
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url);
    setView('customer-detail');
  };

  return (
    <div className="view-container slide-in">
      <div className="view-header">
        <div>
          <h2>Corporate Customers</h2>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>
            Overview of all business and corporate rental accounts.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', flex: 1, minHeight: 0, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <CorporateCustomersIcon active={true} size={20} />
            Corporate Directory
          </h3>
          <input
            type="text"
            className="form-control"
            placeholder="Search corporate..."
            style={{ maxWidth: '250px', fontSize: '0.85rem', height: '38px', padding: '0 0.8rem', boxSizing: 'border-box' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="table-container" style={{ border: 'none', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="custom-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Rental ID</th>
                <th>Customer Details</th>
                <th>Device</th>
                <th>KYC Status</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    {searchQuery ? "No matching corporate records found." : "No corporate customers registered."}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, index) => (
                  <tr 
                    key={index} 
                    className="clickable-row"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onClick={() => handleActionClick(r.rentalId)}
                    title="Click to view full corporate details"
                  >
                    <td style={{ padding: '12px' }}>
                      <span className="rental-tracking-id">{r.rentalId}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {r.customerEmail} • {r.customerPhone}
                      </div>
                    </td>
                    <td>{r.deviceModel}</td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: r.kycStatus === 'Verified' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: r.kycStatus === 'Verified' ? '#22c55e' : '#ef4444'
                      }}>
                        {r.kycStatus || 'Pending'}
                      </span>
                    </td>
                    <td><StatusBadge status={r.settlementStatus} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
