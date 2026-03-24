import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Gamepad2, 
  Wallet, 
  Pickaxe, 
  Users, 
  Share2, 
  History,
  PlayCircle,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Gamepad2, label: 'Game Library', path: '/library' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: MoreHorizontal, label: 'More', path: '/more' },
  { icon: Pickaxe, label: 'Coin Mining', path: '/mining' },
  { icon: PlayCircle, label: 'Watch & Earn', path: '/watch-earn' },
  { icon: Share2, label: 'Refer & Earn', path: '/refer' },
  { icon: Users, label: 'Community', path: '/social' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1635]/95 backdrop-blur-lg border-t border-white/5 px-4 py-2 flex justify-between items-center z-50 md:hidden">
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-brand-primary" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <item.icon size={20} />
            <span className="text-[8px] font-bold uppercase tracking-wider">{item.label.split(' ')[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-72 bg-[#1a1635] border-r border-white/5 h-screen sticky top-0 p-8">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
          <Gamepad2 className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-black tracking-tighter text-white italic uppercase">iGamia</h1>
      </div>

      <div className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 text-sm font-bold tracking-wide",
                isActive 
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <Link to="/profile" className="flex items-center gap-4 p-4 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-primary group-hover:scale-105 transition-transform">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="User" />
          </div>
          <div>
            <p className="text-sm font-black text-white">John Doe</p>
            <div className="flex items-center gap-1 bg-brand-accent/20 px-2 py-0.5 rounded-full">
              <span className="text-[8px] font-black text-brand-accent uppercase">Pro Gamer</span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
