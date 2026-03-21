import React from 'react';
import { Share2, Gift, Users, Copy, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function Refer() {
  const referralCode = "IGAMIA-PRO-2024";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied to clipboard!');
  };

  const steps = [
    { icon: Share2, title: "Share Link", desc: "Send your unique referral link to your friends." },
    { icon: Users, title: "Friends Join", desc: "Your friends sign up and start their gaming journey." },
    { icon: Gift, title: "Earn Rewards", desc: "Get 50 IGC for every friend who completes their first pledge." },
  ];

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Grow the Community</span>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Refer & Earn</h1>
        <p className="text-zinc-400 max-w-2xl leading-relaxed">
          Invite your friends to iGamia and earn exclusive rewards. The more you share, the more you earn!
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Referral Card */}
        <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-[2.5rem] p-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase italic">Your Referral Code</h2>
            <p className="text-zinc-400 text-sm">Share this code with your friends to track your rewards.</p>
          </div>

          <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-2xl">
            <div className="flex-1 px-4 font-mono font-bold text-brand-primary tracking-widest uppercase">
              {referralCode}
            </div>
            <button 
              onClick={copyToClipboard}
              className="bg-brand-primary text-white p-4 rounded-xl hover:bg-brand-accent hover:text-black transition-all shadow-lg shadow-brand-primary/20"
            >
              <Copy size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">12</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invited</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">8</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-brand-accent">400</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Earned IGC</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase italic">How it works</h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-6 p-6 bg-white/5 border border-white/10 rounded-[2rem] group hover:bg-white/10 transition-colors">
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

      {/* Recent Referrals */}
      <section className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/10">
          <h2 className="text-xl font-black uppercase italic text-white">Recent Referrals</h2>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-primary">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=ref${i}`} alt="User" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">User_{i}42</p>
                  <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} /> Verified
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-black text-white">+50 IGC</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
