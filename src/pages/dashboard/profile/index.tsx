import React, { useEffect, useMemo, useState } from 'react';
import { Settings, Edit3, Play, Trophy, Share2, CheckCircle2, Coins, Wallet, ArrowRightLeft, Banknote, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { usePledges } from '../../../hooks/usePledges';
import { useToast } from '../../../components/ToastProvider';

export default function Profile() {
  const { user } = useAuth();
  const { walletData, convertIgc, withdraw } = useWallet(true);
  const { fetchMyStats } = usePledges(false);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('wallet');
  const [competitiveProfile, setCompetitiveProfile] = useState<any>(null);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleConvert = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(convertAmount);
    if (!amount || amount <= 0) {
      toast.warning('Enter a valid IGC amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await convertIgc(amount);
      setConvertAmount('');
      setIsConvertOpen(false);
      toast.success('IGC converted to NGN.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to convert IGC.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.warning('Enter a valid NGN amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await withdraw(amount);
      setWithdrawAmount('');
      setIsWithdrawOpen(false);
      toast.success('Withdrawal request submitted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Unable to withdraw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-[3rem] border border-white/10 bg-white/5 px-8 py-16 text-center text-zinc-500">
        Sign in to load your profile.
      </div>
    );
  }

  return (
    <>
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
                <div className="flex items-center gap-3 text-brand-primary"><Wallet size={20} /><span className="text-[10px] font-black uppercase tracking-widest">NGN Balance</span></div>
                <p className="text-4xl font-black text-white italic">NGN {(walletData?.summary.fiatBalance ?? walletData?.wallet.usdBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-zinc-500 text-sm">Withdrawable balance from gifts, deposits, and conversions.</p>
              </div>
              <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-4">
                <div className="flex items-center gap-3 text-brand-accent"><Coins size={20} /><span className="text-[10px] font-black uppercase tracking-widest">IGC Balance</span></div>
                <p className="text-4xl font-black text-white italic">{walletData?.wallet.igcBalance.toLocaleString() ?? '0'}</p>
                <p className="text-zinc-500 text-sm">Rate: 1 IGC = NGN {(walletData?.summary.igcToNgnRate ?? 10).toLocaleString()}.</p>
              </div>
              <div className="sm:col-span-2 bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quick Wallet Actions</p>
                    <p className="mt-2 text-sm text-zinc-400">Convert IGC to NGN here, then withdraw when you are ready.</p>
                  </div>
                  <p className="text-sm font-black text-white">Portfolio: NGN {(walletData?.summary.totalPortfolioNgn ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => setIsConvertOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    <ArrowRightLeft size={16} />
                    Convert IGC
                  </button>
                  <button onClick={() => setIsWithdrawOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    <Banknote size={16} />
                    Withdraw NGN
                  </button>
                  <Link to="/wallet" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                    Open Wallet
                  </Link>
                </div>
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
                      <p className="text-lg font-black text-white italic">
                        {tx.currency === 'IGC'
                          ? `${tx.amount.toLocaleString()} IGC`
                          : `${tx.currency} ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </p>
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
    <AnimatePresence>
      {isConvertOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <motion.form initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }} onSubmit={handleConvert} className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#16122d] p-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase italic text-white">Convert IGC</h3>
              <button type="button" onClick={() => setIsConvertOpen(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-sm text-zinc-400">Convert IGC into NGN at the current default rate.</p>
            <input type="number" min="1" step="0.01" value={convertAmount} onChange={(event) => setConvertAmount(event.target.value)} placeholder="Amount in IGC" className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none" />
            <button type="submit" disabled={isSubmitting} className="mt-5 w-full rounded-2xl bg-brand-primary py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50">{isSubmitting ? 'Processing...' : 'Convert to NGN'}</button>
          </motion.form>
        </div>
      )}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <motion.form initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }} onSubmit={handleWithdraw} className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#16122d] p-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase italic text-white">Withdraw NGN</h3>
              <button type="button" onClick={() => setIsWithdrawOpen(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-sm text-zinc-400">Submit a withdrawal request from your available NGN balance.</p>
            <input type="number" min="1" step="0.01" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="Amount in NGN" className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none" />
            <button type="submit" disabled={isSubmitting} className="mt-5 w-full rounded-2xl bg-brand-primary py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50">{isSubmitting ? 'Processing...' : 'Confirm Withdrawal'}</button>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
