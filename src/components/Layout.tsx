import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BottomNav, Sidebar } from './Navigation';
import { PledgeNotificationsBell } from './PledgeNotifications';
import { DirectMessageNotifications } from './DirectMessageNotifications';
import { useAuth } from '../hooks/useAuth';
import { getAccessToken } from '../api/axios';

export function Layout() {
  const location = useLocation();
  const isAuth = location.pathname === '/login' || location.pathname === '/signup';
  const { isAuthenticated, loading } = useAuth();
  const hasToken = Boolean(getAccessToken());
  const isResolvingAuthenticatedShell = hasToken && loading;

  if (isAuth) {
    return <Outlet />;
  }

  const content = (
    <div className="flex min-h-screen bg-brand-deep text-zinc-100">
      <Sidebar />
      <main data-dashboard-scroll className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="sticky top-0 z-40 mb-6 flex justify-end py-2">
            {isResolvingAuthenticatedShell ? (
              <div className="h-[4.5rem] w-[11.5rem] rounded-[1.4rem] border border-white/10 bg-[#1a1635]/90 shadow-2xl backdrop-blur-xl" />
            ) : isAuthenticated ? (
              <>
                <DirectMessageNotifications />
                <PledgeNotificationsBell />
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-[#1a1635]/90 px-3 py-3 shadow-2xl backdrop-blur-xl">
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand-primary px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-accent hover:text-black"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  state={{ from: location }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );

  return content;
}
