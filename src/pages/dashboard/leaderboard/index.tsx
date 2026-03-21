import React from 'react';
import { Trophy, Users, Star, TrendingUp, Medal } from 'lucide-react';
import { motion } from 'motion/react';

export default function Leaderboard() {
  const leaders = [
    { id: 1, name: 'ProGamer_99', score: '12,450', rank: 1, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
    { id: 2, name: 'CyberKnight', score: '10,200', rank: 2, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
    { id: 3, name: 'NeonShadow', score: '9,850', rank: 3, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
    { id: 4, name: 'PixelWarrior', score: '8,400', rank: 4, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
    { id: 5, name: 'StormBringer', score: '7,900', rank: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
  ];

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Global Rankings</span>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Leaderboard</h1>
        <p className="text-zinc-400 max-w-2xl leading-relaxed">
          The best of the best. Climb the ranks by winning pledges, streaming, and participating in community events.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top 3 Podium */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {leaders.slice(0, 3).map((leader, i) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-[2.5rem] border border-white/10 overflow-hidden group ${
                i === 0 ? 'bg-brand-primary/20 border-brand-primary/30 md:scale-110 z-10' : 'bg-white/5'
              }`}
            >
              <div className="absolute top-4 right-4">
                <Medal className={i === 0 ? 'text-brand-accent' : i === 1 ? 'text-zinc-300' : 'text-amber-700'} size={32} />
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-24 h-24 rounded-full border-4 overflow-hidden ${
                  i === 0 ? 'border-brand-accent' : 'border-white/10'
                }`}>
                  <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic">{leader.name}</h3>
                  <p className="text-brand-primary font-bold text-sm uppercase tracking-widest">{leader.score} Points</p>
                </div>
                <div className="bg-white/5 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Rank #{leader.rank}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full List */}
        <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase italic text-white">Top Players</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <Users size={14} /> 12,450 Total Players
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {leaders.map((leader, i) => (
              <div key={leader.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-6">
                  <span className="text-2xl font-black text-zinc-700 w-8">0{leader.rank}</span>
                  <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden">
                    <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-brand-primary transition-colors">{leader.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active 2h ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">{leader.score}</p>
                  <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
