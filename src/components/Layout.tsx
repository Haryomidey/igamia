import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav, Sidebar } from './Navigation';
import { PledgeNotificationsBell } from './PledgeNotifications';

export function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuth = location.pathname === '/login' || location.pathname === '/signup';

  if (isLanding || isAuth) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-brand-deep text-zinc-100">
      <Sidebar />
      <main data-dashboard-scroll className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="mb-6 flex justify-end">
            <PledgeNotificationsBell />
          </div>
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
