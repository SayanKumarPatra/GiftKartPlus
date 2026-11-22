import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { adminSession, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-[#594A6B]">
        Loading Admin session...
      </div>
    );
  }

  if (!adminSession) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}
