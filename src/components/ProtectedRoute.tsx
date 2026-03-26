import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAccessToken } from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { needsOnboarding } from '../lib/profile';

export function ProtectedRoute() {
  const location = useLocation();
  const { loading, isAuthenticated, user } = useAuth();
  const hasToken = Boolean(getAccessToken());

  if (loading && hasToken) {
    return (
      <div className="min-h-screen bg-brand-deep text-zinc-100 flex items-center justify-center px-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-6 text-sm text-zinc-300">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (!hasToken || !isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          authMessage: 'Log in first to continue.',
        }}
      />
    );
  }

  if (location.pathname !== '/personalize' && needsOnboarding(user)) {
    return <Navigate to="/personalize" replace />;
  }

  return <Outlet />;
}
