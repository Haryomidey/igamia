import React from 'react';
import { 
  HelpCircle, 
  Shield, 
  Settings, 
  Info, 
  LogOut, 
  Trophy, 
  Share2, 
  Coins,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function More() {
  const menuItems = [
    { icon: User, title: 'User Profile', desc: 'View your gaming stats, achievements, and personal information.', color: 'text-brand-primary', path: '/profile' },
    { icon: Trophy, title: 'Leaderboard', desc: 'Check your ranking and see how you stack up against the best gamers.', color: 'text-brand-accent', path: '/leaderboard' },
    { icon: Share2, title: 'Refer & Earn', path: '/refer', desc: 'Invite your friends to iGamia and earn massive rewards together.', color: 'text-emerald-500' },
    { icon: Coins, title: 'Token Info', path: '/token', desc: 'Learn about iGamia Coins (IGC) and the ecosystem utility.', color: 'text-amber-500' },
    { icon: HelpCircle, title: 'Help & Support', path: '/faq', desc: 'Get help with your account, report issues, and find answers to your questions.', color: 'text-blue-500' },
    { icon: Shield, title: 'Privacy & Security', desc: 'Manage your privacy settings, 2FA, and security preferences.', color: 'text-indigo-500', path: '#' },
    { icon: Info, title: 'About iGamia', desc: 'Learn more about our platform, terms of service, and privacy policy.', color: 'text-zinc-500', path: '#' },
    { icon: LogOut, title: 'Logout', desc: 'Sign out of your account on this device.', color: 'text-rose-500', path: '/' },
  ];

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Settings & Support</span>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">More Options</h1>
        <p className="text-zinc-500 text-sm">Manage your account settings, privacy, and get support.</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {menuItems.map((item, i) => (
          <Link 
            key={i} 
            to={item.path}
            className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-4 hover:bg-white/10 transition-all cursor-pointer group block"
          >
            <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 ${item.color} group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic">{item.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
