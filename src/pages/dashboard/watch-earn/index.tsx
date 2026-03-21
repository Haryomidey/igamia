import React from 'react';
import { PlayCircle, TrendingUp, Gift } from 'lucide-react';

import { Link } from 'react-router-dom';

export default function WatchEarn() {
  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Passive Rewards</span>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Watch & Earn</h1>
        <p className="text-zinc-500 text-sm">Earn IGC by watching your favorite streamers and participating in live events.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: PlayCircle, title: 'Watch Streams', desc: 'Earn 10 IGC every 15 minutes of watching.', color: 'text-brand-primary' },
          { icon: TrendingUp, title: 'Daily Goals', desc: 'Complete daily watch time goals for bonus rewards.', color: 'text-brand-accent' },
          { icon: Gift, title: 'Lucky Drops', desc: 'Random IGC drops during featured live streams.', color: 'text-emerald-500' },
        ].map((item, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-4">
            <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 ${item.color}`}>
              <item.icon size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic">{item.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-brand-primary/10 border border-brand-primary/20 p-12 rounded-[3rem] text-center space-y-6">
        <h2 className="text-3xl font-black text-white uppercase italic">Ready to start earning?</h2>
        <p className="text-zinc-400 max-w-xl mx-auto">Head over to the Home page and pick an ongoing stream to start your earning journey.</p>
        <Link to="/home" className="inline-block bg-brand-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all shadow-xl shadow-brand-primary/20">
          Go to Streams
        </Link>
      </div>
    </div>
  );
}
