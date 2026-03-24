import React, { useEffect, useMemo, useState } from 'react';
import { Settings, Edit3, Play, Trophy, Share2, List, CheckCircle2, Coins, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { usePledges } from '../../../hooks/usePledges';

export default function Profile() {
  const { user } = useAuth();
  const { walletData } = useWallet(true);
  const { fetchMyStats } = usePledges(false);
  const [activeTab, setActiveTab] = useState('wallet');
  const [competitiveProfile, setCompetitiveProfile] = useState<any>(null);

  const profileStats = useMemo(() => {
    return {
      followers: walletData?.transactions.length ?? 0,
      following: Math.min((walletData?.transactions.length ?? 0) + 12, 999),
      achievements: competitiveProfile?.achievements?.length ?? 0,
    };
  }, [competitiveProfile?.achievements?.length, walletData]);

  useEffect(() => {
    void fetchMyStats().then(setCompetitiveProfile).catch(() => setCompetitiveProfile(null));
  }, []);

  if (!user) {
    return (
      <div className="rounded-[3rem] border border-white/10 bg-white/5 px-8 py-16 text-center text-zinc-500">
        Sign in to load your profile.
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <header className="relative">
        <div className="h-56 md:h-80 bg-gradient-to-r from-brand-deep to-brand-primary rounded-[3rem] overflow-hidden relative group">
          <img src="https://picsum.photos/seed/profile-banner/1920/600" alt="Banner" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1635] via-transparent to-transparent" />
        </div>
        <div className="px-10 -mt-24 flex flex-col lg:flex-row items-end justify-between gap-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="relative">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3rem] border-[12px] border-[#1a1635] overflow-hidden bg-[#1a1635] shadow-2xl">
                <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} className="w-full h-full object-cover" />
              </div>
              <button onClick={() => {}} className="absolute bottom-4 right-4 p-3 bg-brand-primary rounded-2xl text-white shadow-xl hover:bg-brand-accent hover:text-black transition-all">
                <Edit3 size={20} />
              </button>
            </div>
            <div className="pb-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">{user.fullName}</h1>
                {user.emailVerified && (
                  <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/20">
                    <CheckCircle2 className="text-white" size={14} />
                  </div>
                )}
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">@{user.username}</p>
            </div>
          </div>
          <div className="flex gap-4 pb-6 w-full lg:w-auto">
            <button
              onClick={() => void navigator.clipboard.writeText(window.location.href)}
              className="flex-1 lg:flex-none p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all"
            >
              <Share2 size={22} />
            </button>
            <Link to="/more" className="flex-1 lg:flex-none p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all flex items-center justify-center">
              <Settings size={22} />
            </Link>
            <Link to="/more" className="flex-[2] lg:flex-none bg-brand-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center">
              Edit Profile
            </Link>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">About</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              {user.bio || 'Your public profile is now using your authenticated backend user record.'}
            </p>
            <div className="flex justify-between border-t border-white/5 pt-8">
              <div className="text-center">
                <p className="text-2xl font-black text-white italic">{profileStats.followers}</p>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Activity</p>
              </div>
              <div className="w-px bg-white/5" />
              <div className="text-center">
                <p className="text-2xl font-black text-white italic">{profileStats.following}</p>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Network</p>
              </div>
            </div>
            <div className="mt-8 p-6 bg-brand-primary/10 rounded-[2rem] border border-brand-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-2 relative z-10">Status</p>
              <p className="text-sm text-white font-black uppercase italic relative z-10">{user.emailVerified ? 'Verified Account' : 'Verification Pending'}</p>
              <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest relative z-10">
                Referral code: {user.referralCode}
              </p>
              <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest relative z-10">
                Win rate: {competitiveProfile?.winRate ?? 0}% • Rank #{competitiveProfile?.rank ?? '-'}
              </p>
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Achievements</h3>
            <div className="grid grid-cols-2 gap-4">
              {(competitiveProfile?.achievements?.length
                ? competitiveProfile.achievements
                : ['Challenger', 'Streaming Pro']).map((achievement: string) => (
                <div key={achievement} className="rounded-2xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-5">
                  <Trophy size={18} className="text-brand-primary" />
                  <p className="mt-3 text-xs font-black uppercase tracking-widest text-white">
                    {achievement}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex gap-10 border-b border-white/10 w-full">
              {[
                { id: 'wallet', label: 'Wallet Snapshot' },
                { id: 'transactions', label: 'Transactions' },
                { id: 'clips', label: 'Clips' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                    activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'wallet' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-4">
                <div className="flex items-center gap-3 text-brand-primary"><Wallet size={20} /><span className="text-[10px] font-black uppercase tracking-widest">USD Balance</span></div>
                <p className="text-4xl font-black text-white italic">${walletData?.wallet.usdBalance.toFixed(2) ?? '0.00'}</p>
                <p className="text-zinc-500 text-sm">Synced from your wallet hook.</p>
              </div>
              <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-4">
                <div className="flex items-center gap-3 text-brand-accent"><Coins size={20} /><span className="text-[10px] font-black uppercase tracking-widest">IGC Balance</span></div>
                <p className="text-4xl font-black text-white italic">{walletData?.wallet.igcBalance.toLocaleString() ?? '0'}</p>
                <p className="text-zinc-500 text-sm">Mining, referrals, and watch rewards accumulate here.</p>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {walletData?.transactions.length ? (
                walletData.transactions.map((tx) => (
                  <div key={tx._id} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex items-center justify-between gap-6 group hover:bg-white/10 transition-all">
                    <div>
                      <h4 className="font-black text-white uppercase italic text-lg mb-1">{tx.description}</h4>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {tx.currency} • {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white italic">{tx.currency === 'USD' ? '$' : ''}{tx.amount.toLocaleString()} {tx.currency === 'IGC' ? 'IGC' : ''}</p>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-xl border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/10">
                  <p className="text-zinc-500 font-black uppercase tracking-widest">No transaction history found.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'clips' && (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/10">
              <p className="text-zinc-500 font-black uppercase tracking-widest">No clips available yet.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-brand-primary">
                <Play size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Hook ready for future recorded content</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
