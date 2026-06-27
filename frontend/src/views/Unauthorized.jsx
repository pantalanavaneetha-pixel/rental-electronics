import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Unauthorized View Component
 * Rendered when a user attempts to access a path they do not have the role permissions for.
 */
export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Dynamic back button redirection based on role
  const handleBack = () => {
    if (user?.role === 'Service Technician') {
      navigate('/return');
    } else if (user?.role === 'Accounts Staff') {
      navigate('/settlement');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary, #f8fafc)',
      color: 'var(--text-primary, #0f172a)',
      fontFamily: 'var(--font-primary)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div className="alert-message-box alert-danger-style" style={{
        maxWidth: '500px',
        padding: '3rem 2rem',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.75rem 0', letterSpacing: '-0.02em' }}>
            Access Restricted
          </h1>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.6, margin: 0 }}>
            Your account role <strong>({user?.role || 'Guest'})</strong> does not possess the credentials required to view this panel.
          </p>
        </div>

        <button
          onClick={handleBack}
          className="btn btn-secondary"
          style={{
            padding: '0.65rem 1.75rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            marginTop: '0.5rem',
            width: '100%'
          }}
        >
          Return to Portal
        </button>
      </div>
    </div>
  );
}
