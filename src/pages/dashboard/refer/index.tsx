import React from 'react';
import { Share2, Gift, Users, Copy, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useReferrals } from '../../../hooks/useReferrals';
import { useToast } from '../../../components/ToastProvider';

export default function Refer() {
  const { summary, loading, error, fetchReferrals } = useReferrals(true);
  const toast = useToast();

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard.');
  };

  React.useEffect(() => {
    if (error) {
      toast.error(error, { title: 'Referral Error' });
    }
  }, [error, toast]);

  const steps = [
    { icon: Share2, title: 'Share Link', desc: 'Send your unique referral link to your friends.' },
    { icon: Users, title: 'Friends Join', desc: 'Your friends sign up and start their gaming journey.' },
    { icon: Gift, title: 'Earn Rewards', desc: 'Receive IGC rewards once referrals get credited.' },
  ];

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Grow the Community</span>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Refer & Earn</h1>
            <p className="text-zinc-400 max-w-2xl leading-relaxed">
              Your referral code, referral link, and earned totals now come from the backend.
            </p>
          </div>
          <button
            onClick={() => void fetchReferrals()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-[2.5rem] p-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase italic">Your Referral Code</h2>
            <p className="text-zinc-400 text-sm">Share this code or link with friends to track your rewards.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl">
              <div className="flex-1 px-4 font-mono font-bold text-brand-primary tracking-widest uppercase">
                {loading && !summary ? 'Loading...' : summary?.referralCode ?? 'Unavailable'}
              </div>
              <button
                onClick={() => summary?.referralCode && void copyToClipboard(summary.referralCode)}
                className="bg-brand-primary text-white p-4 rounded-xl hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20"
                disabled={!summary?.referralCode}
              >
                <Copy size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl">
              <div className="flex-1 px-4 text-sm font-medium text-zinc-300 truncate">
                {summary?.referralLink ?? 'Referral link unavailable'}
              </div>
              <button
                onClick={() => summary?.referralLink && void copyToClipboard(summary.referralLink)}
                className="bg-white/10 text-white p-4 rounded-xl hover:bg-white/20 transition-all"
                disabled={!summary?.referralLink}
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">{summary?.totalReferrals ?? 0}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invited</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">{summary?.referrals.filter((item) => item.status === 'rewarded').length ?? 0}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rewarded</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-brand-accent">{summary?.totalRewardedIgc ?? 0}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Earned IGC</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase italic">How it works</h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-6 p-6 bg-white/5 border border-white/10 rounded-4xl group hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                  <step.icon size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-white uppercase italic">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/10">
          <h2 className="text-xl font-black uppercase italic text-white">Recent Referrals</h2>
        </div>
        <div className="p-8">
          {summary?.referrals.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {summary.referrals.map((item) => {
                const username = item.referredUserId?.username ?? 'Pending user';
                return (
                  <div key={item._id} className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-primary">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt={username} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.referredUserId?.fullName ?? username}</p>
                      <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={10} /> {item.status}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs font-black text-white">+{item.rewardIgc ?? 0} IGC</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-4xl border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-500">
              {loading ? 'Loading referrals...' : 'No referrals yet.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}