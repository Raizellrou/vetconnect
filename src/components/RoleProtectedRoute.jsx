import React from "react";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
  }

  if (!currentUser) {
    // not authenticated -> show landing (or login)
    return <Navigate to="/" replace />;
  }

  if (!userData) {
    // user authenticated but user data still loading
    return <div style={{ padding: 24 }}>Loading user data...</div>;
  }

  if (!allowedRoles.includes(userData.role)) {
    // role not allowed -> redirect to their correct dashboard
    if (userData.role === "clinicOwner") {
      return <Navigate to="/clinic-dashboard" replace />;
    }
    return <Navigate to="/owner-dashboard" replace />;
  }

  return <>{children}</>;
}
