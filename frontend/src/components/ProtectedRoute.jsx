import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * Restricts access to routes based on authentication state and user roles.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // 1. Render a clean loader while the Auth Context restores the session
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary, #f8fafc)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-color, #e2e8f0)',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // 2. Redirect unauthenticated users to the Login screen
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Redirect authenticated but unauthorized users to the Unauthorized page
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Render child routes if validation succeeds
  return <Outlet />;
}
