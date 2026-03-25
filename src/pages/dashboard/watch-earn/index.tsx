import React from 'react';
import { ArrowRight, Coins, Radio, Timer, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WatchEarn() {
  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-3">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Stream Rewards</span>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Watch Streams & Earn</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">
          This section is now focused on live stream activity, not separate video-claim cards. Join streams, stay active,
          and use the mining rewards area for the scheduled daily watch sessions.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        {[
          {
            icon: Radio,
            title: 'Live Streams',
            value: 'Watch active rooms',
            desc: 'Open live stream sessions and stay engaged with the platform in real time.',
            color: 'text-brand-primary',
          },
          {
            icon: Timer,
            title: 'Activity Flow',
            value: 'Session based',
            desc: 'Rewards here are about stream participation, not clicking through separate video cards.',
            color: 'text-brand-accent',
          },
          {
            icon: Coins,
            title: 'Reward Focus',
            value: 'Streams first',
            desc: 'The daily scheduled watch queue remains under the mining rewards page.',
            color: 'text-emerald-400',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 space-y-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${item.color}`}>
              <item.icon size={24} />
            </div>
            <h2 className="text-xl font-black uppercase italic text-white">{item.title}</h2>
            <p className="text-2xl font-black text-white">{item.value}</p>
            <p className="text-sm leading-relaxed text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[3rem] border border-white/10 bg-white/5 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic text-white">How This Works Now</h2>
              <p className="text-sm text-zinc-500">One place for stream activity, one place for scheduled watch rewards.</p>
            </div>
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
            <p>Live stream watching belongs here, so the old reward video cards have been removed from this page.</p>
            <p>The scheduled 3-video reward sequence stays on the mining page, where the cooldown and watch gating are enforced.</p>
            <p>If you want to earn through stream participation, open the live areas below and stay active there.</p>
          </div>
        </div>

        <div className="rounded-[3rem] border border-brand-primary/20 bg-brand-primary/10 p-8 space-y-5">
          <div className="inline-flex rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-primary">
            Quick Actions
          </div>

          <Link
            to="/home"
            className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-black/20 px-5 py-5 text-white transition-all hover:bg-black/30"
          >
            <div>
              <p className="text-lg font-black uppercase italic">Browse Live Streams</p>
              <p className="text-sm text-zinc-400">Open the dashboard feed and jump into active stream rooms.</p>
            </div>
            <ArrowRight size={20} className="text-brand-primary" />
          </Link>

          <Link
            to="/stream"
            className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-black/20 px-5 py-5 text-white transition-all hover:bg-black/30"
          >
            <div>
              <p className="text-lg font-black uppercase italic">Open Stream Room</p>
              <p className="text-sm text-zinc-400">Go straight into the live stream experience.</p>
            </div>
            <ArrowRight size={20} className="text-brand-primary" />
          </Link>

          <Link
            to="/mining"
            className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-black/20 px-5 py-5 text-white transition-all hover:bg-black/30"
          >
            <div>
              <p className="text-lg font-black uppercase italic">Open Daily Watch Rewards</p>
              <p className="text-sm text-zinc-400">Manage the scheduled one-at-a-time watch sessions there.</p>
            </div>
            <ArrowRight size={20} className="text-brand-primary" />
          </Link>
        </div>
      </section>
    </div>
  );
}
