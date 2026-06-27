import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GoldCoinStack, 
  IncidentShield, 
  CalendarDue, 
  CheckCircleIcon, 
  WarningTriangleIcon, 
  InvoiceClipboard,
  ExclamationCircleIcon
} from '../components/PremiumIcons';

/**
 * CustomerPortal Component
 * Restricted view dedicated to logged-in Customers.
 * Lists active leases, deposit statuses, damage claims with photo proof, and late fee summaries.
 */
export default function CustomerPortal({ records, formatVal }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  // Filter rentals belonging to the logged-in customer by email
  const customerEmail = user?.email || '';
  const customerRecords = records.filter(r => 
    r.customerEmail && r.customerEmail.trim().toLowerCase() === customerEmail.trim().toLowerCase()
  );

  const activeRentals = customerRecords.filter(r => r.settlementStatus !== 'Settled');
  const pastRentals = customerRecords.filter(r => r.settlementStatus === 'Settled');

  // Compute total escrow deposits currently held
  const activeEscrowSum = activeRentals.reduce((sum, r) => sum + (r.securityDepositHeld || 0), 0);

  return (
    <div className="animated-view" style={{ overflow: 'auto', padding: '1rem 0' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#fff',
        marginBottom: '24px',
        boxShadow: '0 10px 25px rgba(15,23,42,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: '50%',
          filter: 'blur(30px)'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              RentShield CC Portal
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Welcome, {user?.name || 'Customer'} 👋
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
              Registered Email: {user?.email}
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 18px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Escrow</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{formatVal(activeEscrowSum)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '0.9rem',
            fontWeight: activeTab === 'active' ? 700 : 500,
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Active Rentals ({activeRentals.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '0.9rem',
            fontWeight: activeTab === 'history' ? 700 : 500,
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Settlement History ({pastRentals.length})
        </button>
      </div>

      {/* Content Panels */}
      {activeTab === 'active' ? (
        activeRentals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px 0' }}>No Active Leases</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>You do not currently have any electronics rented out from our vault.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {activeRentals.map(rental => {
              const isUnderReview = rental.settlementStatus === 'Under Review' || rental.settlementStatus === 'Isolated Repair';
              const isOverdue = rental.daysOverdue > 0;
              
              return (
                <div key={rental.rentalId} style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'transform 0.25s',
                  position: 'relative'
                }}
                className="hover-card-trigger"
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, background: 'var(--bg-input)', padding: '3px 8px', borderRadius: '6px' }}>
                      {rental.rentalId}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '3px 9px',
                      borderRadius: '12px',
                      background: isUnderReview ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                      color: isUnderReview ? '#f59e0b' : '#6366f1'
                    }}>
                      {rental.settlementStatus}
                    </span>
                  </div>

                  {/* Device Header */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{rental.deviceModel}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                      Serial Number: {rental.deviceSerial || 'Pending'}
                    </p>
                  </div>

                  {/* Date Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(120,120,120,0.03)', padding: '10px', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>START DATE</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '2px' }}>{rental.startDate.split('T')[0]}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>DUE DATE</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '2px', color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {rental.endDate.split('T')[0]}
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>Deposit Escrow Held</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '2px' }}>
                        {formatVal(rental.securityDepositHeld)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>Condition Notes</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 500, marginTop: '2px', color: 'var(--text-muted)' }}>
                        {rental.notes || 'Normal Wear'}
                      </div>
                    </div>
                  </div>

                  {/* Late Warning Alert */}
                  {isOverdue && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      alignItems: 'center'
                    }}>
                      <WarningTriangleIcon size={16} style={{ color: 'var(--danger)' }} />
                      <span style={{ fontSize: '0.73rem', color: 'var(--danger)', fontWeight: 600 }}>
                        Overdue by {rental.daysOverdue} days (Penalty: ₹1,250/day accrues)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        pastRentals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📜</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px 0' }}>No Settlement Records</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>You do not have any historical rental settlements on record.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {pastRentals.map(rental => {
              const hasDamage = rental.damageDeduction > 0;
              const hasLateFee = rental.lateFeeCharged > 0;

              return (
                <div key={rental.rentalId} style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, background: 'var(--bg-input)', padding: '3px 8px', borderRadius: '6px', marginRight: '8px' }}>
                        {rental.rentalId}
                      </span>
                      <strong style={{ fontSize: '1.1rem', fontWeight: 800 }}>{rental.deviceModel}</strong>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Settled on: {rental.settlementAt ? rental.settlementAt.split('T')[0] : 'N/A'}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 9px',
                        borderRadius: '12px',
                        background: 'rgba(16,185,129,0.1)',
                        color: '#10b981'
                      }}>
                        {rental.settlementStatus}
                      </span>
                    </div>
                  </div>

                  {/* Grid Layout splits financial ledger on left, and evidence/AI notes on right */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    
                    {/* Left Panel: Ledger breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
                        Financial Reconciliation
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Initial Security Deposit:</span>
                        <span style={{ fontWeight: 600 }}>{formatVal(rental.securityDepositHeld)}</span>
                      </div>

                      {hasDamage && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--danger)' }}>
                          <span>Damage Repair Deduction ({rental.damageType.split('(')[0].trim()}):</span>
                          <span style={{ fontWeight: 600 }}>-{formatVal(rental.damageDeduction - rental.lateFeeCharged)}</span>
                        </div>
                      )}

                      {hasLateFee && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--danger)' }}>
                          <span>Late Return Fee ({rental.daysOverdue} Days):</span>
                          <span style={{ fontWeight: 600 }}>-{formatVal(rental.lateFeeCharged)}</span>
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '10px',
                        marginTop: '4px',
                        color: '#10b981'
                      }}>
                        <span>Disbursed Refund:</span>
                        <span>{formatVal(Math.max(0, rental.securityDepositHeld - rental.damageDeduction))}</span>
                      </div>

                      {rental.paymentMethod && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Reconciled via <strong>{rental.paymentMethod}</strong>
                        </div>
                      )}
                    </div>

                    {/* Right Panel: Audit & AI evidence notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(120,120,120,0.02)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <InvoiceClipboard size={16} style={{ color: '#6366f1' }} />
                        <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          Post-Inspection Audit Trail
                        </h4>
                      </div>

                      {/* Photo evidence preview if claims existed */}
                      {rental.photoEvidenceUrl && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img 
                            src={rental.photoEvidenceUrl} 
                            alt="Damage Evidence proof" 
                            style={{ width: '80px', height: '54px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PHOTO EVIDENCE ATTACHED</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary)', marginTop: '2px' }}>Verified by AI Core</div>
                          </div>
                        </div>
                      )}

                      {/* AI generated explanation note */}
                      {rental.customerFriendlyNotes ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(99,102,241,0.04)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.1)' }}>
                          <span style={{ fontSize: '1rem', lineHeight: 1 }}>🤖</span>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            <strong>AI Explainer:</strong> {rental.customerFriendlyNotes}
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#10b981' }}>
                          <CheckCircleIcon size={14} style={{ color: '#10b981' }} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Perfect condition return - zero claims logged.</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
